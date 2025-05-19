# Node.js 18 기반 이미지 사용
FROM node:18

# 컨테이너 내부 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 나머지 모든 소스 코드 복사
COPY . .

# 애플리케이션이 사용하는 포트
EXPOSE 5000

# 앱 실행 명령어
CMD ["node", "server.js"]
