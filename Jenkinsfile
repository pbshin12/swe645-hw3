// Peter Shin (G01073633)
// Jenkins pipeline for the hw3 monorepo: builds and pushes the Docker images, then deploys via the Helm chart
pipeline {
    agent any
    parameters {
        booleanParam(name: 'DEPLOY', defaultValue: true, description: 'Deploy the image to Kubernetes')
    }
    environment {
        DOCKER_FRONTEND_REPO = 'frozenmandu/swe645-hw3-frontend'
        DOCKER_BACKEND_REPO = 'frozenmandu/swe645-hw3-backend'
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/pbshin12/swe645-hw3.git'
            }
        }
        stage('Build') {
            steps {
                script {
                    dockerFrontendImage = docker.build("${DOCKER_FRONTEND_REPO}:${BUILD_NUMBER}", "./frontend")
                    dockerBackendImage = docker.build("${DOCKER_BACKEND_REPO}:${BUILD_NUMBER}", "./backend")
                }
            }
        }
        stage('Push to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
                        dockerFrontendImage.push()
                        dockerBackendImage.push()
                    }
                }
            }
        }
        stage('Deploy') {
            when {
                expression { params.DEPLOY }
            }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-id', variable: 'KUBECONFIG')]) {
                    sh 'helm upgrade --install swe645-hw3 ./swe645-hw3 --set image.tag=${BUILD_NUMBER}'
                }
            }
        }
    }
    post {
        success {
            echo 'Deployment successful'
        }
        failure {
            echo 'Deployment failed'
        }
        always {
            sh 'docker rmi ${DOCKER_FRONTEND_REPO}:${BUILD_NUMBER} || true'
            sh 'docker rmi ${DOCKER_BACKEND_REPO}:${BUILD_NUMBER} || true'
        }
    }
}
