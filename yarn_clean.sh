rm -rf node_modules yarn.lock
rm -rf apps/native/node_modules
rm -rf apps/web/node_modules

# after running this clean script
# ran 
# yarn set version berry
# yarn
# npm run build

#  Some peer dependencies are incorrectly met by dependencies; run yarn explain peer-requirements for details.