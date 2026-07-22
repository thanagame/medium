pipeline {
  // รันบน Agent ที่มี Label "node-pnpm" (สร้างและต่อไว้แล้วใน Part 4)
  // ไม่ใช้ agent any เพราะ Controller ไม่มี Node/pnpm ติดตั้งอยู่
  agent { label 'node-pnpm' }

  environment {
    PNPM_VERSION = '10.25.0'
    // prisma.config.ts ของโปรเจกต์บังคับต้องมี DATABASE_URL อยู่เสมอ
    // แม้ตอน generate จะไม่ได้เชื่อมต่อ Database จริงก็ตาม จึงใส่ค่า Fake ที่ Parse ผ่านได้
    DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci?schema=public'
  }

  options {
    timestamps()               // แสดง timestamp หน้าทุกบรรทัดใน Console Output
    disableConcurrentBuilds()  // กัน Build ซ้อนกันของ Branch/PR เดียวกัน
  }

  stages {
    // ===== ส่วน CI: รันทุกกรณี ไม่ว่าจะเป็น PR หรือ Push เข้า Branch ใดก็ตาม =====
    stage('Install') {
      steps {
        sh 'corepack enable'                                   // เปิดใช้งาน corepack ที่มากับ Node
        sh "corepack prepare pnpm@${env.PNPM_VERSION} --activate"  // ดึง pnpm เวอร์ชันที่ต้องการมาใช้
        sh 'pnpm install --frozen-lockfile'                    // ติดตั้ง Dependency ตาม lockfile เป๊ะๆ ห้ามอัปเดตเอง
      }
    }

    stage('Build shared') {
      // packages/shared ต้อง Build ก่อนเสมอ เพราะ apps/api และ apps/web import type จากตรงนี้
      steps { sh 'pnpm build:shared' }
    }

    stage('Prisma generate') {
      // Service/Test ที่ import @prisma/client ตอน runtime ต้องมี Client ที่ Generate แล้วก่อน
      steps { sh 'pnpm --filter @repo/api prisma:generate' }
    }

    stage('Quality') {
      // รัน Lint และ Test พร้อมกันแบบขนาน เพื่อประหยัดเวลารวมของ Pipeline
      parallel {
        stage('Lint') { steps { sh 'pnpm lint' } }
        stage('Test') {
          steps { sh 'pnpm --filter @repo/api --filter @repo/web --parallel test' }
        }
      }
    }

    // ===== ส่วน Sonar + Quality Gate: รันเฉพาะตอนเป็น PR หรือ Branch หลัก (ใช้บล็อก Merge) =====
    stage('SonarQube Analysis') {
      when { anyOf { changeRequest(); branch 'develop'; branch 'staging'; branch 'main' } }
      steps {
        withSonarQubeEnv('SonarQubeLocal') {   // ดึง Server URL/Token จาก Config ใน Manage Jenkins → System อัตโนมัติ
          script {
            def scannerHome = tool 'SonarScanner'     // หา Path ของ Sonar Scanner CLI ที่ตั้งไว้ใน Manage Jenkins → Tools
            sh "${scannerHome}/bin/sonar-scanner"     // อ่านค่าจาก sonar-project.properties เอง ไม่ต้องใส่ -D ยาวๆ
          }
        }
      }
    }

    stage('Quality Gate') {
      when { anyOf { changeRequest(); branch 'develop'; branch 'staging'; branch 'main' } }
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          // รอผลจาก SonarQube Webhook (ตั้งไว้ใน Part 6.4) ถ้าไม่ผ่าน Build จะ Fail ทันที = Merge ไม่ได้
          waitForQualityGate abortPipeline: true
        }
      }
    }

    // ===== Build Image: เฉพาะ Branch ที่ต้อง Deploy จริง ไม่ใช่ตอนเป็น PR (ประหยัดเวลา/Resource) =====
    stage('Build Images') {
      when {
        allOf {
          not { changeRequest() }                                   // ไม่ใช่ PR
          anyOf { branch 'develop'; branch 'staging'; branch 'main' } // ต้องเป็น Branch หลักเท่านั้น
        }
      }
      steps {
        // ส่ง DATABASE_URL เข้า docker build ด้วย เพราะ prisma generate ที่รันอยู่ข้างใน Dockerfile ต้องการค่านี้
        // (Environment Variable ของ Jenkins Agent ไม่ได้ถูกส่งเข้า docker build ให้อัตโนมัติ ต้องส่งผ่าน --build-arg เอง)
        sh """
          docker build --build-arg DATABASE_URL='${env.DATABASE_URL}' \
            -f apps/api/Dockerfile -t medium-api:${env.BRANCH_NAME}-${env.BUILD_NUMBER} .
          docker build -f apps/web/Dockerfile -t medium-web:${env.BRANCH_NAME}-${env.BUILD_NUMBER} .
        """
      }
    }

    // ===== Deploy: แยกตาม Branch ที่ Trigger =====
stage('Deploy DEV') {
  when { branch 'develop' }
  steps {
    sh """
      export TAG=${env.BRANCH_NAME}-${env.BUILD_NUMBER}
      IMAGE_TAG=\$TAG docker compose -p medium-dev -f docker-compose.dev.yml build kong
      IMAGE_TAG=\$TAG docker compose -p medium-dev -f docker-compose.dev.yml pull api web || true
      IMAGE_TAG=\$TAG docker compose -p medium-dev -f docker-compose.dev.yml up -d --remove-orphans
    """
  }
}
    stage('Deploy STAGING') {
      when { branch 'staging' }
      steps {
        sh """
          export TAG=${env.BRANCH_NAME}-${env.BUILD_NUMBER}
          docker compose -p medium-staging -f docker-compose.staging.yml pull || true
          IMAGE_TAG=\$TAG docker compose -p medium-staging -f docker-compose.staging.yml up -d --remove-orphans
        """
      }
    }
    stage('Deploy PROD') {
      when { branch 'main' }
      steps {
        // Pipeline จะหยุดรอตรงนี้จนกว่าจะมีคนกดอนุมัติในหน้า Jenkins
        input message: 'อนุมัติให้ Deploy ขึ้น Production?'
        withCredentials([
          string(credentialsId: 'prod-postgres-password', variable: 'POSTGRES_PASSWORD'),
          string(credentialsId: 'prod-jwt-secret',        variable: 'JWT_SECRET')
        ]) {
          sh """
            export TAG=${env.BRANCH_NAME}-${env.BUILD_NUMBER}
            docker compose -p medium-prod -f docker-compose.prod.yml pull || true
            IMAGE_TAG=\$TAG POSTGRES_PASSWORD=\$POSTGRES_PASSWORD JWT_SECRET=\$JWT_SECRET \
              docker compose -p medium-prod -f docker-compose.prod.yml up -d --remove-orphans
          """
        }
      }
    }
  }

  post {
    success { echo "OK — ${env.BRANCH_NAME} #${env.BUILD_NUMBER}" }
    failure { echo 'FAILED — เปิดดู Console Output' }
    always  { cleanWs() }   // ล้าง Workspace ทุกครั้งไม่ว่าผลจะเป็นอย่างไร กัน Disk เต็ม
  }
}