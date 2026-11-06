class Solution {
public:
    vector<string> findAllRecipes(vector<string>& recipes, vector<vector<string>>& ingredients, vector<string>& supplies) {
        unordered_map<string, vector<int>> usedBy;   // ingredient name → recipe indices that need it
        vector<int> need(recipes.size());            // in-degree of each recipe
        for (size_t i = 0; i < recipes.size(); i++) {
            need[i] = ingredients[i].size();
            for (auto& item : ingredients[i]) usedBy[item].push_back(i);
        }

        queue<string> q;                             // available items
        for (auto& s : supplies) q.push(s);
        vector<string> made;
        while (!q.empty()) {
            auto it = usedBy.find(q.front());
            q.pop();
            if (it == usedBy.end()) continue;
            for (int i : it->second) {
                if (--need[i] == 0) {                // last missing ingredient arrived
                    made.push_back(recipes[i]);
                    q.push(recipes[i]);              // the recipe is now an ingredient too
                }
            }
        }
        return made;
    }
};
