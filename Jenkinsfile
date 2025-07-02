pipeline {
    agent any
    
    environment {
        APP_NAME = 'sample-webapp'
        BUILD_DIR = '/opt/cicd-workspace/builds/docker-images'
        DEPLOY_DIR = '/opt/cicd-workspace/deployments/containers'
        REPO_DIR = '/opt/cicd-workspace/repositories/source'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
                
                script {
                    // Copy source to organized directory
                    sh """
                        mkdir -p ${REPO_DIR}/${APP_NAME}
                        cp -r . ${REPO_DIR}/${APP_NAME}/
                    """
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh '''
                    # Use NVM to ensure correct Node version
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    
                    # Use Node version from .nvmrc
                    nvm use
                    
                    # Install dependencies
                    npm ci
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use
                    
                    # Run tests with coverage
                    npm run test:coverage
                '''
            }
            post {
                always {
                    // Archive test results
                    script {
                        sh "mkdir -p ${BUILD_DIR}/${APP_NAME}/test-reports"
                        sh "cp -r coverage ${BUILD_DIR}/${APP_NAME}/test-reports/ || true"
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    sh """
                        mkdir -p ${BUILD_DIR}/${APP_NAME}
                        
                        # Build Docker image
                        docker build -t ${APP_NAME}:${BUILD_NUMBER} .
                        docker build -t ${APP_NAME}:latest .
                        
                        # Save build info
                        echo "Build Number: ${BUILD_NUMBER}" > ${BUILD_DIR}/${APP_NAME}/build-info.txt
                        echo "Build Date: \$(date)" >> ${BUILD_DIR}/${APP_NAME}/build-info.txt
                        echo "Git Commit: \$(git rev-parse HEAD)" >> ${BUILD_DIR}/${APP_NAME}/build-info.txt
                    """
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                script {
                    sh """
                        mkdir -p ${DEPLOY_DIR}/${APP_NAME}
                        
                        # Stop existing container if running
                        docker stop ${APP_NAME} || true
                        docker rm ${APP_NAME} || true
                        
                        # Run new container
                        docker run -d \\
                            --name ${APP_NAME} \\
                            -p 3000:3000 \\
                            -e NODE_ENV=production \\
                            -e DB_HOST=localhost \\
                            -e DB_USER=cicd_user \\
                            -e DB_PASSWORD=MySecurePass123! \\
                            -e DB_NAME=cicd_app \\
                            --network host \\
                            ${APP_NAME}:latest
                        
                        # Wait for container to start
                        sleep 10
                        
                        # Health check
                        curl -f http://localhost:3000/health || exit 1
                        
                        # Save deployment info
                        echo "Deployment Date: \$(date)" > ${DEPLOY_DIR}/${APP_NAME}/deploy-info.txt
                        echo "Container ID: \$(docker ps -q -f name=${APP_NAME})" >> ${DEPLOY_DIR}/${APP_NAME}/deploy-info.txt
                        echo "Image: ${APP_NAME}:${BUILD_NUMBER}" >> ${DEPLOY_DIR}/${APP_NAME}/deploy-info.txt
                    """
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo '🎉 Pipeline completed successfully!'
            echo "Application is running at: http://34.93.100.155:3000"
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
