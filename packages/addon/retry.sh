retry() {
  local cmd="$@"
  local attempt_num=1
  until $cmd; do
    if (( attempt_num == 5 )); then
      echo "Attempt $attempt_num failed! Exiting."
      exit 1
    fi
    echo "Attempt $attempt_num failed! Retrying in 5 seconds..."
    sleep 5
    attempt_num+=1
  done
}