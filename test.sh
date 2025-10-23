#!/bin/bash

# =========================================
# 🚀 Configuration
# =========================================
URL="http://localhost:4000/test-transaction"   # Change to your actual API endpoint
ADDRESS="0x7b6ed12821B52f41e3117Cc95A336E9649ACA7f7"  # Replace with target address
COUNT=1        # Number of transactions per request (your backend loops inside)
TOTAL_REQUESTS=50   # Number of concurrent curl requests

# =========================================
# ⚡ Function to send one request
# =========================================
send_request() {
  local id=$1
  echo "📤 Sending request #$id ..."
  
  curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d '{
      "address": "'"$ADDRESS"'",
      "count": '"$COUNT"'
    }' > /dev/null &   # Send in background for concurrency
}

# =========================================
# 🧵 Main Execution
# =========================================
echo "🚀 Sending $TOTAL_REQUESTS concurrent requests to $URL"
start=$(date +%s)

for i in $(seq 1 $TOTAL_REQUESTS); do
  send_request "$i"
done

# Wait for all to finish
wait

end=$(date +%s)
runtime=$((end - start))

echo "✅ All $TOTAL_REQUESTS requests sent in ${runtime}s."
