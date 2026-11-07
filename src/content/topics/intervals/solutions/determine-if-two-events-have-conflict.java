class Solution {
    public boolean haveConflict(String[] event1, String[] event2) {
        // Closed intervals overlap iff each starts no later than the other ends.
        // "HH:MM" strings are fixed-width, so string order == time order.
        return event1[0].compareTo(event2[1]) <= 0 && event2[0].compareTo(event1[1]) <= 0;
    }
}
