class Solution {
    public int numRescueBoats(int[] people, int limit) {
        int[] w = people.clone();
        Arrays.sort(w);
        int l = 0, r = w.length - 1, boats = 0;
        while (l <= r) {                       // l == r: one person left, needs a boat
            if (w[l] + w[r] <= limit) l++;     // lightest rides along
            r--;                               // heaviest always leaves
            boats++;
        }
        return boats;
    }
}
