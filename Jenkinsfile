pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS-LTS'
    }
    
    environment {
        APP_NAME = 'sample-webapp'
        // Use Jenkins workspace instead of /opt/cicd-workspace
        BUILD_DIR = "${WORKSPACE}/builds"
        DEPLOY_DIR = "${WORKSPACE}/deploy"
        DOCKER_IMAGE = "${APP_NAME}:${BUILD_NUMBER}"
        DOCKER_LATEST = "${APP_NAME}:latest"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Source code already checked out by Jenkins SCM'
                script {
                    // Create build directories in Jenkins workspace
                    sh """
                        mkdir -p ${BUILD_DIR}
                        mkdir -p ${DEPLOY_DIR}
                        ls -la .
                    """
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh '''
                    # Verify Node.js version
                    node --version
                    npm --version
                    
                    # Clean install
                    npm ci
                    
                    # Verify installation
                    npm list --depth=0
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running tests with coverage...'
                sh '''
                    # Set test environment
                    export NODE_ENV=test
                    
                    # Run tests
                    npm run test:coverage
                '''
            }
            post {
                always {
                    script {
                        sh """
                            mkdir -p ${BUILD_DIR}/test-reports
                            cp -r coverage ${BUILD_DIR}/test-reports/ || echo 'No coverage reports found'
                            ls -la ${BUILD_DIR}/test-reports/ || echo 'Test reports directory not created'
                        """
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    sh """
                        # Build Docker image
                        docker build -t ${DOCKER_IMAGE} .
                        docker tag ${DOCKER_IMAGE} ${DOCKER_LATEST}
                        
                        # Save build info
                        echo "Build Number: ${BUILD_NUMBER}" > ${BUILD_DIR}/build-info.txt
                        echo "Build Date: \$(date)" >> ${BUILD_DIR}/build-info.txt
                        echo "Git Commit: \$(git rev-parse HEAD)" >> ${BUILD_DIR}/build-info.txt
                        echo "Docker Image: ${DOCKER_IMAGE}" >> ${BUILD_DIR}/build-info.txt
                        
                        # List Docker images
                        docker images | grep ${APP_NAME} || echo 'No images found'
                    """
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                script {
                    sh """
                        # Stop and remove existing container
                        docker stop ${APP_NAME} || echo 'No existing container to stop'
                        docker rm ${APP_NAME} || echo 'No existing container to remove'
                        
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
                            ${DOCKER_LATEST}
                        
                        # Wait for container to start
                        echo 'Waiting for container to start...'
                        sleep 15
                        
                        # Health check with retries
                        for i in {1..5}; do
                            if curl -f http://localhost:3000/health; then
                                echo "Health check passed on attempt \$i"
                                break
                            else
                                echo "Health check failed on attempt \$i, retrying..."
                                sleep 5
                            fi
                        done
                        
                        # Save deployment info
                        echo "Deployment Date: \$(date)" > ${DEPLOY_DIR}/deploy-info.txt
                        echo "Container ID: \$(docker ps -q -f name=${APP_NAME})" >> ${DEPLOY_DIR}/deploy-info.txt
                        echo "Image: ${DOCKER_IMAGE}" >> ${DEPLOY_DIR}/deploy-info.txt
                        echo "Status: \$(docker ps --filter name=${APP_NAME} --format 'table {{.Status}}')" >> ${DEPLOY_DIR}/deploy-info.txt
                        
                        # Show running containers
                        docker ps | grep ${APP_NAME} || echo 'Container not running'
                    """
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying deployment...'
                script {
                    sh '''
                        # Test all endpoints
                        echo "Testing main endpoint:"
                        curl -s http://localhost:3000/ || echo "Main endpoint failed"
                        
                        echo "Testing health endpoint:"
                        curl -s http://localhost:3000/health || echo "Health endpoint failed"
                        
                        echo "Testing users endpoint:"
                        curl -s http://localhost:3000/users || echo "Users endpoint failed"
                        
                        echo "Container status:"
                        docker ps --filter name=sample-webapp || echo "No container found"
                        
                        echo "Container logs (last 20 lines):"
                        docker logs --tail 20 sample-webapp || echo "No logs available"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline completed - preserving workspace for debugging'
            script {
                sh """
                    echo "Pipeline completed at: \$(date)" > ${WORKSPACE}/pipeline-summary.txt
                    echo "Build Number: ${BUILD_NUMBER}" >> ${WORKSPACE}/pipeline-summary.txt
                    echo "Git Commit: \$(git rev-parse HEAD)" >> ${WORKSPACE}/pipeline-summary.txt
                """
            }
        }
        success {
            echo '🎉 Pipeline completed successfully!'
            echo "✅ Application is running at: http://34.93.100.155:3000"
            echo "✅ Health check: http://34.93.100.155:3000/health"
            echo "✅ API endpoints: http://34.93.100.155:3000/users"
        }
        failure {
            echo '❌ Pipeline failed!'
            script {
                sh '''
                    echo "Debugging information:"
                    docker ps -a | grep sample-webapp || echo "No containers found"
                    docker logs sample-webapp || echo "No container logs available"
                    df -h || echo "Disk space check failed"
                    free -h || echo "Memory check failed"
                '''
            }
        }
    }
}