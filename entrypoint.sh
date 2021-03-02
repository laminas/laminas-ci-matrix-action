#!/bin/bash

set -e

function checkout {
    local REF=
    local LOCAL_BRANCH=
    local BASE_BRANCH=
    case $GITHUB_EVENT_NAME in
        pull_request)
            REF=$GITHUB_REF
            LOCAL_BRANCH=$GITHUB_HEAD_REF
            BASE_BRANCH=$GITHUB_BASE_REF
            ;;
        push)
            REF=${GITHUB_REF/refs\/heads\//}
            LOCAL_BRANCH=${REF}
            ;;
        tag)
            REF=${GITHUB_REF/refs\/tags\//}
            LOCAL_BRANCH=${REF}
            ;;
        *)
            echo "Unable to handle events of type $GITHUB_EVENT_NAME; aborting"
            exit 1
    esac

    echo "Cloning repository"
    git clone https://github.com/"${GITHUB_REPOSITORY}" .

    if [[ "$REF" == "$LOCAL_BRANCH" ]];then
        echo "Checking out ref ${REF}"
        git checkout $REF
    else
        echo "Checking out branch ${BASE_BRANCH}"
        git checkout ${BASE_BRANCH}
        echo "Fetching target ref ${REF}"
        git fetch origin ${REF}:${GITHUB_HEAD_REF}
        echo "Checking out target ref to ${GITHUB_HEAD_REF}"
        git checkout ${GITHUB_HEAD_REF}
    fi
}

checkout

DIFF=

if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]];then
    echo "Preparing file diff"
    DIFF=$(git diff --name-only $GITHUB_BASE_REF...HEAD)
fi

REQUIRE_CHECKS=true
if [[ "$DIFF" != "" ]];then
    echo "Found changes in the following files:"
    echo ${DIFF}
fi

node /action/index.js ${DIFF}
