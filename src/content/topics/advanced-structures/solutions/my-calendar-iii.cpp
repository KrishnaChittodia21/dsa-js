class MyCalendarThree {
    map<int, int> delta;   // time -> change in active events, sorted by time

public:
    MyCalendarThree() {
    }

    int book(int startTime, int endTime) {
        delta[startTime]++;
        delta[endTime]--;
        int active = 0, best = 0;
        for (auto& [t, d] : delta) {   // sweep left to right
            active += d;
            best = max(best, active);
        }
        return best;
    }
};
