npm run build
npx cap sync
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
cd ..
