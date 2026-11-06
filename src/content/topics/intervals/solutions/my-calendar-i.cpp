class MyCalendar {
    vector<pair<int, int>> bookings; // sorted by start, pairwise disjoint, half-open [s, e)

public:
    MyCalendar() {
    }

    bool book(int start, int end) {
        // lower bound: first booking whose start >= start
        auto it = lower_bound(bookings.begin(), bookings.end(), start,
                              [](const pair<int, int>& b, int s) { return b.first < s; });
        if (it != bookings.end() && it->first < end) return false;           // successor starts too early
        if (it != bookings.begin() && prev(it)->second > start) return false; // predecessor ends too late
        bookings.insert(it, {start, end});
        return true;
    }
};
