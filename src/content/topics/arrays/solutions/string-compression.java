class Solution {
    public int compress(char[] chars) {
        int write = 0, read = 0;
        while (read < chars.length) {
            int j = read;
            while (j < chars.length && chars[j] == chars[read]) j++; // end of the group
            int count = j - read;

            chars[write++] = chars[read];
            if (count > 1) {
                for (char d : String.valueOf(count).toCharArray()) chars[write++] = d; // '1','2' for 12
            }
            read = j;                                                // next group
        }
        return write;
    }
}
