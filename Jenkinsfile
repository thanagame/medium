pipeline {
  // 🔧 รันบน Agent ที่ตั้งชื่อ Label ไว้ใน Part 4.3 (ไม่ใช่ agent { docker {...} } แบบเดิม)
  agent { label 'node-pnpm' }

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
        sh "corepack prepare pnpm@${env.PNPM_VERSION} --activate"
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Build shared') {            // ต้อง build ก่อน api/web
      steps {
        sh 'pnpm build:shared'
      }
    }

    stage('Prisma generate') {         // service test import @prisma/client ตอน runtime
      steps {
        sh 'pnpm --filter @repo/api prisma:generate'
      }
    }

    stage('Sonar Scan') {                 // lint + test พร้อมกัน (Part 7)
      parallel {
        stage('Lint') {
          steps {
            sh 'pnpm lint'
          }
        }
        stage('Test') {
          steps {
            sh 'pnpm --filter @repo/api --filter @repo/web --parallel test'
          }
        }
      }
    }

    // ===== Sonar + Quality Gate: PR + branch หลัก (บล็อก merge) =====
    stage('SonarQube Analysis') {
      when {
        anyOf {
          changeRequest()
          branch 'develop'
          branch 'staging'
          branch 'main'
        }
      }
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
      when {
        anyOf {
          changeRequest()
          branch 'develop'
          branch 'staging'
          branch 'main'
        }
      }
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
        // Agent มี docker CLI ติดตั้งไว้แล้วจาก Part 4 — ไม่ต้องลงเพิ่มสดๆ ตอนนี้
      sh """
  docker build \
    --build-arg DATABASE_URL='${env.DATABASE_URL}' \
    -f apps/api/Dockerfile \
    -t medium-api:${env.BRANCH_NAME}-${env.BUILD_NUMBER} .
"""
        sh "docker build -f apps/web/Dockerfile -t medium-web:${env.BRANCH_NAME}-${env.BUILD_NUMBER} ."
      }
    }

    // ===== Deploy แยกตาม branch =====
    // NOTE: บนเครื่องเดียว deploy หลาย env พร้อมกัน port ชนกัน (8000/3006)
    //       ตอนเรียนให้ deploy ทีละ env
stage('Deploy DEV') {
      when { branch 'develop' }
      steps {
        echo "Deploy on dev..."
      }
    }

    stage('Deploy PROD') {
      when { branch 'main' }
      steps {
        echo "Deploy on PROD..."
      }
    }
stage('Deploy STAGING') {
      when { branch 'staging' }
      steps {
        echo "Deploy on STAGING..."
      }
    }

    stage('Deploy PROD') {
      when { branch 'main' }
      steps {
        echo "Deploy on PROD..."
      }
    }
  }

  post {
    success { echo "OK — ${env.BRANCH_NAME} #${env.BUILD_NUMBER}" }
    failure { echo 'FAILED — เปิดดู Console Output' }
    always  { cleanWs() }
  }
}