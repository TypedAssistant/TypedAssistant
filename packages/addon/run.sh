#!/usr/bin/with-contenv bashio

CONFIG_PATH=/data/options.json

## SETUP ENV VARIABLES
COMMAND_TO_RUN=$(jq --raw-output '.commandToRun // empty' $CONFIG_PATH)
HASS_TOKEN_FROM_CONFIG=$(jq --raw-output '.hassToken // empty' $CONFIG_PATH)
HASS_URL_FROM_CONFIG=$(jq --raw-output '.hassUrl // empty' $CONFIG_PATH)
HASS_EXTERNAL_URL_FROM_CONFIG=$(jq --raw-output '.hassExternalUrl // empty' $CONFIG_PATH)
GITHUB_TOKEN_FROM_CONFIG=$(jq --raw-output '.githubToken // empty' $CONFIG_PATH)
GITHUB_USERNAME_FROM_CONFIG=$(jq --raw-output '.githubUsername // empty' $CONFIG_PATH)
GITHUB_REPO_FROM_CONFIG=$(jq --raw-output '.githubRepo // empty' $CONFIG_PATH)
GITHUB_BRANCH_FROM_CONFIG=$(jq --raw-output '.githubBranch // empty' $CONFIG_PATH)
ADDITIONAL_ENV_VARIABLES=$(jq --raw-output '.additionalEnvVariables[]? // empty' $CONFIG_PATH)
CLEAN_START=$(jq --raw-output '.cleanStart // empty' $CONFIG_PATH)

if [[ -z "$COMMAND_TO_RUN" ]]; then
    echo "Error: COMMAND_TO_RUN is not set. Set this in Add-on configuration."
    exit 1
fi

export HASS_SERVER=${HASS_SERVER:-"$HASS_URL_FROM_CONFIG"}
export HASS_TOKEN=${HASS_TOKEN:-"$HASS_TOKEN_FROM_CONFIG"}
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"
export GITHUB_TOKEN=$GITHUB_TOKEN_FROM_CONFIG
export GITHUB_USERNAME=$GITHUB_USERNAME_FROM_CONFIG
export GITHUB_REPO=$GITHUB_REPO_FROM_CONFIG
export GITHUB_BRANCH=$GITHUB_BRANCH_FROM_CONFIG
export HASS_EXTERNAL_URL=$HASS_EXTERNAL_URL_FROM_CONFIG
for var in $ADDITIONAL_ENV_VARIABLES; do
    export $var
done

## SETUP PROJECT DIRECTORY
clone_and_copy_template() {
    git clone --depth 1 "https://github.com/TypedAssistant/TypedAssistantBeta.git" /ta-repo
    cp -ra /ta-repo/packages/template/. /config/TypedAssistantBeta
    rm -rf /ta-repo
}

setup_and_push_to_backup_repo() {
    cd /config/TypedAssistantBeta
    git init
    git add .
    git branch -M "$GITHUB_BRANCH_FROM_CONFIG"
    git commit -m "Initial commit"
    echo "Attempting to push to git@github.com:$GITHUB_USERNAME_FROM_CONFIG/$GITHUB_REPO_FROM_CONFIG.git"
    git remote add origin https://$GITHUB_USERNAME_FROM_CONFIG:$GITHUB_TOKEN_FROM_CONFIG@github.com/$GITHUB_USERNAME_FROM_CONFIG/$GITHUB_REPO_FROM_CONFIG.git || true
    git push -u origin "$GITHUB_BRANCH_FROM_CONFIG"
    cd -
}

if [ ! -d "/config/TypedAssistantBeta" ] || [ -z "$(ls -A /config/TypedAssistantBeta)" ]; then
    echo "TypedAssistantBeta directory does not exist"
    clone_and_copy_template
fi

if [[ -n "$GITHUB_TOKEN_FROM_CONFIG" && -n "$GITHUB_USERNAME_FROM_CONFIG" && -n "$GITHUB_REPO_FROM_CONFIG" && -n "$GITHUB_BRANCH_FROM_CONFIG" ]]; then
    echo "Github details provided"
    git clone -b "$GITHUB_BRANCH_FROM_CONFIG" "https://$GITHUB_USERNAME_FROM_CONFIG:$GITHUB_TOKEN_FROM_CONFIG@github.com/$GITHUB_USERNAME_FROM_CONFIG/$GITHUB_REPO_FROM_CONFIG" /config/TypedAssistantBackup || true

    if [ ! -d "/config/TypedAssistantBackup" ] || [ -z "$(ls -A /config/TypedAssistantBackup)" ]; then
        echo "Remote backup repo is empty"
        setup_and_push_to_backup_repo
    else
        echo "Remote backup repo is not empty"
        rm -rf /config/TypedAssistantBeta
        cp -ra /config/TypedAssistantBackup/. /config/TypedAssistantBeta
        cd /config/TypedAssistantBeta
        git reset --hard "origin/$GITHUB_BRANCH_FROM_CONFIG"
        cd -
    fi
    
    rm -rf /config/TypedAssistantBackup
fi

## SETUP DEPENDENCIES
bun preinstall.tsx /config/TypedAssistantBeta/package.json
cd /config/TypedAssistantBeta
bun upgrade
bun install

## GO
$COMMAND_TO_RUN & BUN_PID=$!
wait $BUN_PID