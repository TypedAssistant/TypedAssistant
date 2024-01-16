#!/usr/bin/with-contenv bashio

CONFIG_PATH=/data/options.json

COMMAND_TO_RUN=$(jq --raw-output '.commandToRun // empty' $CONFIG_PATH)
HASS_TOKEN_FROM_CONFIG=$(jq --raw-output '.hassToken // empty' $CONFIG_PATH)
HASS_URL_FROM_CONFIG=$(jq --raw-output '.hassUrl // empty' $CONFIG_PATH)
GITHUB_TOKEN_FROM_CONFIG=$(jq --raw-output '.githubToken // empty' $CONFIG_PATH)
GITHUB_USERNAME_FROM_CONFIG=$(jq --raw-output '.githubUsername // empty' $CONFIG_PATH)
GITHUB_REPO_FROM_CONFIG=$(jq --raw-output '.githubRepo // empty' $CONFIG_PATH)
GITHUB_BRANCH_FROM_CONFIG=$(jq --raw-output '.githubBranch // empty' $CONFIG_PATH)


export HASS_SERVER_TO_USE=${HASS_SERVER:-"$HASS_URL_FROM_CONFIG"}
export HASS_TOKEN_TO_USE=${HASS_TOKEN:-"$HASS_TOKEN_FROM_CONFIG"}
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"

echo "SUPERVISOR_TOKEN: ${SUPERVISOR_TOKEN}"

if [[ -z "$COMMAND_TO_RUN" ]]; then
    echo "Error: COMMAND_TO_RUN is not set. Set this in Add-on configuration."
    exit 1
fi
if [[ -z "$HASS_SERVER_TO_USE" ]]; then
    echo "Error: HASS_SERVER is not set. Please provide a value for HASS_SERVER."
    exit 1
fi
if [[ -z "$HASS_TOKEN_TO_USE" ]]; then
    echo "Error: HASS_TOKEN is not set. Please provide a value for HASS_TOKEN."
    exit 1
fi

if [ ! -d "/addons/TypedAssistant" ]; then
    mkdir -p /addons/TypedAssistant

    if [[ -n "$GITHUB_TOKEN_FROM_CONFIG" && -n "$GITHUB_USERNAME_FROM_CONFIG" && -n "$GITHUB_REPO_FROM_CONFIG" && -n "$GITHUB_BRANCH_FROM_CONFIG" ]]; then
        git clone -b "$GITHUB_BRANCH_FROM_CONFIG" "https://$GITHUB_USERNAME_FROM_CONFIG:$GITHUB_TOKEN_FROM_CONFIG@github.com/$GITHUB_USERNAME_FROM_CONFIG/$GITHUB_REPO_FROM_CONFIG" /addons/TypedAssistant

        if [ -z "$(ls -A /addons/TypedAssistant)" ]; then
            cp -ra /TypedAssistant/packages/template/. /addons/TypedAssistant
            cd /addons/TypedAssistant
            git add .
            git commit -m "Initial commit"
            git push origin "$GITHUB_BRANCH_FROM_CONFIG"
        fi
    else
        cp -ra /TypedAssistant/packages/template/. /addons/TypedAssistant
    fi
    
    rm -rf /TypedAssistant
fi
cd /addons/TypedAssistant
bun install

# code-server --bind-addr 0.0.0.0:3822 --auth none &
# CODE_SERVER_PID=$!;

GITHUB_TOKEN=$GITHUB_TOKEN_FROM_CONFIG \
GITHUB_USERNAME=$GITHUB_USERNAME_FROM_CONFIG \
GITHUB_REPO=$GITHUB_REPO_FROM_CONFIG \
GITHUB_BRANCH=$GITHUB_BRANCH_FROM_CONFIG \
HASS_SERVER=$HASS_SERVER_TO_USE \
HASS_TOKEN=$HASS_TOKEN_TO_USE \
$COMMAND_TO_RUN & BUN_PID=$!

wait $BUN_PID
# wait $CODE_SERVER_PID $BUN_PID