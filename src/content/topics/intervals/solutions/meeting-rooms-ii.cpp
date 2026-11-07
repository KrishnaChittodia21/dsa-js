class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        vector<int> starts, ends;
        for (const auto& m : intervals) {
            starts.push_back(m[0]);
            ends.push_back(m[1]);
        }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int rooms = 0;
        size_t j = 0; // ends[0..j-1] are meetings that have already finished
        for (size_t i = 0; i < starts.size(); i++) {
            if (starts[i] >= ends[j]) {
                j++;     // some meeting finished by now -> reuse its room
            } else {
                rooms++; // all rooms busy -> open a new one
            }
        }
        return rooms;
    }
};
