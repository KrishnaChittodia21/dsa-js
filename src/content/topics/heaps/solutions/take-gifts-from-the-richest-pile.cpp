class Solution {
public:
    long long pickGifts(vector<int>& gifts, int k) {
        priority_queue<int> heap(gifts.begin(), gifts.end());
        for (int t = 0; t < k; t++) {
            int top = heap.top();
            heap.pop();
            heap.push((int) sqrt((double) top)); // leave floor(sqrt) gifts in the pile
        }
        long long total = 0; // up to 10^12
        while (!heap.empty()) {
            total += heap.top();
            heap.pop();
        }
        return total;
    }
};
