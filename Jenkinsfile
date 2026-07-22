pipeline {
  // ⬇️ ถ้าติด GID ของ docker socket ให้ปรับ --group-add ให้ตรงเครื่อง
  agent {
    docker {
      image 'node:22-bookworm-slim'
      args '-v /var/run/docker.sock:/var/run/docker.sock --group-add 999'
    }
  }

  environment {
    PNPM_VERSION = '10.25.0'
    // prisma.config.ts บังคับต้องมี DATABASE_URL แม้ generate จะไม่ต่อ DB จริง
    DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci?schema=public'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    // ===== CI: รันทุกกรณี (PR และทุก branch) =====
    stage('Install') {
      steps {
        sh 'corepack enable'
        sh 'corepack prepare pnpm@$PNPM_VERSION --activate'
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Build shared') {            // ต้อง build ก่อน api/web
      steps { sh 'pnpm build:shared' }
    }

    stage('Prisma generate') {         // service test import @prisma/client ตอน runtime
      steps { sh 'pnpm --filter @repo/api prisma:generate' }
    }

    stage('Quality') {                 // lint + test พร้อมกัน (Part 7)
      parallel {
        stage('Lint') { steps { sh 'pnpm lint' } }
        stage('Test') {
          steps { sh 'pnpm --filter @repo/api --filter @repo/web --parallel test' }
        }
      }
    }

    // ===== Sonar + Quality Gate: PR + branch หลัก (บล็อก merge) =====
    stage('SonarQube Analysis') {
      when { anyOf { changeRequest(); branch 'develop'; branch 'staging'; branch 'main' } }
      steps {
        withSonarQubeEnv('SonarQubeLocal') {
          script {
            def scannerHome = tool 'SonarScanner'
            sh "${scannerHome}/bin/sonar-scanner"   // อ่าน sonar-project.properties เอง
          }
        }
      }
    }

    stage('Quality Gate') {
      when { anyOf { changeRequest(); branch 'develop'; branch 'staging'; branch 'main' } }
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true    // ไม่ผ่าน = build FAIL = merge ไม่ได้
        }
      }
    }

    // ===== Build image: เฉพาะ branch ที่จะ deploy (ไม่ใช่ PR) =====
    stage('Build Images') {
      when {
        allOf {
          not { changeRequest() }
          anyOf { branch 'develop'; branch 'staging'; branch 'main' }
        }
      }
      steps {
        sh 'docker build -f apps/api/Dockerfile -t medium-api:$BRANCH_NAME-$BUILD_NUMBER .'
        sh 'docker build -f apps/web/Dockerfile -t medium-web:$BRANCH_NAME-$BUILD_NUMBER .'
      }
    }

    // ===== Deploy แยกตาม branch =====
    // NOTE: บน Mac เครื่องเดียว deploy หลาย env พร้อมกัน port ชนกัน (8000/3006)
    //       ตอนเรียนให้ deploy ทีละ env
    stage('Deploy DEV') {
      when { branch 'develop' }
      steps { echo 'Deploy -> DEV' /* docker compose -p medium-dev ... */ }
    }
    stage('Deploy STAGING') {
      when { branch 'staging' }
      steps { echo  "Deploy -> STAGING"  }
    }
    stage('Deploy PROD') {
      when { branch 'main' }
      steps {
        input message: 'อนุมัติให้ Deploy ขึ้น Production?'   // Manual Approval
        echo 'Deploy -> PROD'
        // inject POSTGRES_PASSWORD / JWT_SECRET จาก Credentials ก่อน (withCredentials)
      }
    }
  }

  post {
    success { echo "OK — ${env.BRANCH_NAME} #${env.BUILD_NUMBER}" }
    failure { echo 'FAILED — เปิดดู Console Output' }
    always  { cleanWs() }
  }
}