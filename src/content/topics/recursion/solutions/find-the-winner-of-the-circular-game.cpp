class Solution {
public:
    int findTheWinner(int n, int k) {
        return j(n, k) + 1;                     // convert to 1-based friend number
    }

private:
    // j(m) = 0-based survivor position in a circle of m friends
    int j(int m, int k) {
        if (m == 1) return 0;                   // one friend: they win
        return (j(m - 1, k) + k) % m;           // shift the smaller answer back into this circle
    }
};
