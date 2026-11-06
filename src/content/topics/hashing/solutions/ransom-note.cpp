class Solution {
public:
    bool canConstruct(string ransomNote, string magazine) {
        if (ransomNote.size() > magazine.size()) return false;
        int count[26] = {};
        for (char ch : magazine) count[ch - 'a']++;
        for (char ch : ransomNote) {
            if (--count[ch - 'a'] < 0) return false;   // ran out of this letter
        }
        return true;
    }
};
