class Solution {
public:
    bool canPlaceFlowers(vector<int>& flowerbed, int n) {
        vector<int> bed = flowerbed; // do not mutate the caller's array
        int size = bed.size(), planted = 0;
        for (int i = 0; i < size && planted < n; i++) {
            bool leftEmpty = i == 0 || bed[i - 1] == 0;
            bool rightEmpty = i == size - 1 || bed[i + 1] == 0;
            if (bed[i] == 0 && leftEmpty && rightEmpty) {
                bed[i] = 1; // plant as early as possible
                planted++;
            }
        }
        return planted >= n;
    }
};
