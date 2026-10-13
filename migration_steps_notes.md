1. Set the inputs once

Run the shell examples in Bash. Use a new local workspace and an empty destination Git repository. Do not use a local folder whose contents you need to preserve for another task.

~~~bash
export AWS_PROFILE='default'
export AWS_REGION='ap-south-1'
export AWS_DEFAULT_REGION="$AWS_REGION"

export GEN1_REPO_URL='https://github.com/gowthammail4macair/amplify-gen1-fullstack.git'
export GEN1_GIT_BRANCH='main'
export GEN1_APP_ID='d1zija7gqlw461'
export GEN1_ORIGINAL_ENV='dev'
export GEN1_TEST_ENV='pftest'

export PROJECT5_REPO_URL='https://github.com/gowthammail4macair/project5.git'
export GEN2_BRANCH='main'

export PROJECT5_WORKSPACE="$HOME/project5-migration"
export GEN1_CONTROL_DIR="$PROJECT5_WORKSPACE/gen1-test-control"
export PROJECT5_DIR="$PROJECT5_WORKSPACE/project5"
export EVIDENCE_DIR="$PROJECT5_WORKSPACE/private-evidence"
export STATEFUL_TYPES_FILE="$EVIDENCE_DIR/additional-stateful-types.json"

mkdir -p "$PROJECT5_WORKSPACE" "$EVIDENCE_DIR"
chmod 700 "$EVIDENCE_DIR"
printf '[]\n' > "$STATEFUL_TYPES_FILE"