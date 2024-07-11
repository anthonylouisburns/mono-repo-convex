rm -rf node_modules yarn.lock
rm -rf apps/native/node_modules
rm -rf apps/web/node_modules
\
# after running this clean script
# ran 
# yarn
# npm run build
# yarn set version berry

# yarn looks good
# MacBook-Air:mono-repo-convex ashleylorettedills$ yarn
# ➤ YN0000: · Yarn 4.3.1
# ➤ YN0000: ┌ Resolution step
# ➤ YN0000: └ Completed
# ➤ YN0000: ┌ Post-resolution validation
# ➤ YN0086: │ Some peer dependencies are incorrectly met by dependencies; run yarn explain peer-requirements for details.
# ➤ YN0000: └ Completed
# ➤ YN0000: ┌ Fetch step
# ➤ YN0000: └ Completed in 0s 615ms
# ➤ YN0000: ┌ Link step
# ➤ YN0000: └ Completed
# ➤ YN0000: · Done with warnings in 1s 66ms

# error tried removing clerk-react from package.json so only clerk/clerk-react is left
# MacBook-Air:mono-repo-convex ashleylorettedills$ yarn 
# ➤ YN0000: · Yarn 4.3.1
# ➤ YN0000: ┌ Resolution step
# ➤ YN0000: └ Completed
# ➤ YN0000: ┌ Post-resolution validation
# ➤ YN0060: │ react is listed by your project with version 18.2.0 (pc9671), which doesn't satisfy what clerk-react and other dependencies request (but they have non-overlapping ranges!).
# ➤ YN0086: │ Some peer dependencies are incorrectly met by your project; run yarn explain peer-requirements <hash> for details, where <hash> is the six-letter p-prefixed code.
# ➤ YN0086: │ Some peer dependencies are incorrectly met by dependencies; run yarn explain peer-requirements for details.
# ➤ YN0000: └ Completed
# ➤ YN0000: ┌ Fetch step
# ➤ YN0000: └ Completed in 0s 588ms
# ➤ YN0000: ┌ Link step
# ➤ YN0000: └ Completed in 0s 203ms
# ➤ YN0000: · Done with warnings in 1s 46ms