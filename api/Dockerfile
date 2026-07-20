# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copiar archivos de Gradle primero (cachea dependencias si no cambian)
COPY gradlew settings.gradle build.gradle ./
COPY gradle/ gradle/
COPY wrapper/ wrapper/
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# Copiar código fuente y compilar
COPY src/ src/
RUN ./gradlew bootJar --no-daemon

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
