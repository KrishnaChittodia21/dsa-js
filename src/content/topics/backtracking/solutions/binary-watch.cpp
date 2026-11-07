class Solution {
    // indices 0..3 are hour LEDs, 4..9 are minute LEDs
    const int values[10] = {8, 4, 2, 1, 32, 16, 8, 4, 2, 1};

    void backtrack(int start, int remaining, int hour, int minute, vector<string>& result) {
        if (hour > 11 || minute > 59) return; // prune invalid times
        if (remaining == 0) {
            result.push_back(to_string(hour) + ":" + (minute < 10 ? "0" : "") + to_string(minute));
            return;
        }
        for (int i = start; i < 10; i++) {
            if (i < 4) backtrack(i + 1, remaining - 1, hour + values[i], minute, result);
            else backtrack(i + 1, remaining - 1, hour, minute + values[i], result);
        }
    }

public:
    vector<string> readBinaryWatch(int turnedOn) {
        vector<string> result;
        backtrack(0, turnedOn, 0, 0, result);
        return result;
    }
};
