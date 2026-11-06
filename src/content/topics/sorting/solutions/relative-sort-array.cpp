class Solution {
public:
    vector<int> relativeSortArray(vector<int>& arr1, vector<int>& arr2) {
        vector<int> count(1001, 0);
        for (int v : arr1) count[v]++;

        vector<int> out;
        out.reserve(arr1.size());
        for (int v : arr2) {                 // arr2 order first
            while (count[v] > 0) { out.push_back(v); count[v]--; }
        }
        for (int v = 0; v <= 1000; v++) {    // leftovers ascending
            while (count[v] > 0) { out.push_back(v); count[v]--; }
        }
        return out;
    }
};
