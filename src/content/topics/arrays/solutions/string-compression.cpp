class Solution {
public:
    int compress(vector<char>& chars) {
        int write = 0, read = 0, n = chars.size();
        while (read < n) {
            int j = read;
            while (j < n && chars[j] == chars[read]) j++; // end of the group
            int count = j - read;

            chars[write++] = chars[read];
            if (count > 1) {
                for (char d : to_string(count)) chars[write++] = d; // '1','2' for 12
            }
            read = j;                                     // next group
        }
        return write;
    }
};
