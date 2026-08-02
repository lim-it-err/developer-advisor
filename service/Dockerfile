FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY pom.xml ./
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /workspace/target/advisor-0.1.0.jar ./advisor.jar

ENV SPRING_PROFILES_ACTIVE=mock
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/advisor.jar"]
