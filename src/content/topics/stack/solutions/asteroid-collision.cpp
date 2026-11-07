class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> st; // used as a stack
        for (int a : asteroids) {
            bool alive = true;
            // Collision only when the top moves right and the new one moves left.
            while (alive && a < 0 && !st.empty() && st.back() > 0) {
                if (st.back() < -a) {
                    st.pop_back();  // top explodes; a keeps flying
                } else if (st.back() == -a) {
                    st.pop_back();  // both explode
                    alive = false;
                } else {
                    alive = false;  // a explodes
                }
            }
            if (alive) st.push_back(a);
        }
        return st;
    }
};
