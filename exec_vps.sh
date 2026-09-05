#!/usr/bin/env bash
ssh -o BatchMode=yes root@31.97.180.251 "bash --noprofile --norc -c '$*'"
