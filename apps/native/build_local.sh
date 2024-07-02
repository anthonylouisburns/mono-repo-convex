# DEV
# export CONVEX_DEPLOYMENT=dev:doting-bee-40 

# export EXPO_PUBLIC_CONVEX_URL=https://doting-bee-40.convex.cloud
# export CLERK_SECRET_KEY=sk_test_Gaue1EaJjOkwZvbg6rzqO368WDL1p0P8jkWyD5FnOF
# export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_ZmFpci1tb3RoLTY5LmNsZXJrLmFjY291bnRzLmRldiQ"

# PROD 
# export CONVEX_DEPLOY_KEY=prod:tame-condor-52|01d3bc66ee8c8ce41641559e4c8d6d2b50cb08019a0b93cd874943bc6f43d98a3a328f1bfcd52c5a3e062e5397f6a1e06b78
# export CONVEX_DEPLOYMENT=prod:tame-condor-52
export EXPO_PUBLIC_CONVEX_URL=https://tame-condor-52.convex.cloud
export CLERK_SECRET_KEY=sk_live_vc1mWpoQf3mURsBiPRe5ouL0xhmmJi5s5WwOILrFFF
export EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZXZlcndoei5jb20k
export JAVA_HOME=/opt/homebrew/opt/openjdk@21  #/usr/lib/jvm/java-8-openjdk-amd64
# brew link openjdk@11
# eas build -p android --profile preview --local
eas build -p ios --profile preview --local


mv build*.gz ../../../builds/


mv build*.apk ../../../builds/
# next prod secrets
# CONVEX_DEPLOY_KEY=prod:tame-condor-52|01d3bc66ee8c8ce41641559e4c8d6d2b50cb08019a0b93cd874943bc6f43d98a3a328f1bfcd52c5a3e062e5397f6a1e06b78
# CLERK_SECRET_KEY=sk_live_vc1mWpoQf3mURsBiPRe5ouL0xhmmJi5s5WwOILrFFF
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZXZlcndoei5jb20k

