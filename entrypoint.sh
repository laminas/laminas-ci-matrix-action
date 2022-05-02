#!/bin/bash

set -e

function checkout {
    local REF=
    local LOCAL_BRANCH=
    local LOCAL_BRANCH_NAME=
    local BASE_BRANCH=

    if [[ ! $GITHUB_EVENT_NAME || ! $GITHUB_REPOSITORY || ! $GITHUB_REF ]];then
        return
    fi

    LOCAL_BRANCH_NAME=$GITHUB_HEAD_REF

    case $GITHUB_EVENT_NAME in
        pull_request)
            REF=$GITHUB_REF
            LOCAL_BRANCH=$GITHUB_HEAD_REF
            BASE_BRANCH=$GITHUB_BASE_REF

            if [[ ! $LOCAL_BRANCH || ! $BASE_BRANCH ]]; then
                echo "Missing head or base ref env variables; aborting"
                exit 1
            fi

            LOCAL_BRANCH_NAME=pull/${LOCAL_BRANCH_NAME}
            ;;
        push)
            REF=${GITHUB_REF/refs\/heads\//}
            LOCAL_BRANCH=${REF}
            ;;
        schedule)
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

    if [ -d ".git" ];then
        echo "Updating and fetching from canonical repository"
        if [[ $(git remote) =~ origin ]];then
            git remote remove origin
        fi
        git remote add origin https://github.com/"${GITHUB_REPOSITORY}"
        git fetch origin
    else
        echo "Cloning repository"
        git config --global --add safe.directory "${PWD}"
        git clone https://github.com/"${GITHUB_REPOSITORY}" .
    fi

    if [[ "$REF" == "$LOCAL_BRANCH" ]];then
        echo "Checking out ref ${REF}"
        git checkout $REF
    else
        echo "Checking out branch ${BASE_BRANCH}"
        git checkout ${BASE_BRANCH}
        echo "Fetching target ref ${REF}"
        git fetch origin ${REF}:${LOCAL_BRANCH_NAME}
        echo "Checking out target ref to ${LOCAL_BRANCH_NAME}"
        git checkout ${LOCAL_BRANCH_NAME}
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
