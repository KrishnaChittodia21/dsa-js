class MedianFinder {
    priority_queue<int> low;                              // smaller half; top = largest of the small numbers
    priority_queue<int, vector<int>, greater<int>> high;  // larger half; top = smallest of the large numbers

public:
    MedianFinder() {
    }

    void addNum(int num) {
        low.push(num);
        high.push(low.top());                // keep every low <= every high
        low.pop();
        if (high.size() > low.size()) {      // keep low the same size or one bigger
            low.push(high.top());
            high.pop();
        }
    }

    double findMedian() {
        if (low.size() > high.size()) return low.top();
        return ((long long) low.top() + high.top()) / 2.0; // long long: the sum can pass 2^31
    }
};
