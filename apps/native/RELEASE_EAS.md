# APPLE

export EXPO_NO_CAPABILITY_SYNC=1
eas build --platform ios --auto-submit
eas build --platform android --auto-submit

## OR

eas build --platform ios
eas submit --platform ios

# Simulator

eas build -p ios --profile preview

# Build Native

1. build for release - EXPO_NO_CAPABILITY_SYNC=1
   1. eas build --platform all
   2. eas build --platform android (need to finish registration and find android device)
   3. eas build --platform ios
2. build for simulator
   1. eas build -p all --profile preview
   1. eas build -p ios --profile preview
   1. eas build -p android --profile preview
3. build locally for simulator
   1. eas build -p ios --profile preview --local
   2. eas build -p android --profile preview --local

eas build:run -p ios
eas submit --platform ios
eas secret:push --scope project --env-file .env
