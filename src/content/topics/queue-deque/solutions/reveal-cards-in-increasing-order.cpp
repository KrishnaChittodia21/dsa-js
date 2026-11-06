class Solution {
public:
    vector<int> deckRevealedIncreasing(vector<int>& deck) {
        int n = deck.size();
        vector<int> cards = deck;
        sort(cards.begin(), cards.end());
        queue<int> q;
        for (int i = 0; i < n; i++) q.push(i);
        vector<int> res(n);
        for (int card : cards) {
            res[q.front()] = card;                   // this position is revealed next
            q.pop();
            if (!q.empty()) {                        // next top goes to the bottom
                q.push(q.front());
                q.pop();
            }
        }
        return res;
    }
};
