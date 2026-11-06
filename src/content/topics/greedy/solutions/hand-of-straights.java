class Solution {
    public boolean isNStraightHand(int[] hand, int groupSize) {
        if (hand.length % groupSize != 0) return false;
        TreeMap<Integer, Integer> count = new TreeMap<>(); // keys in sorted order
        for (int card : hand) count.merge(card, 1, (a, b) -> a + b);
        for (int v : new ArrayList<>(count.keySet())) { // a copy: the loop updates counts as it goes
            int c = count.get(v);
            if (c == 0) continue; // already used by earlier straights
            // c straights must start at v (v is the smallest remaining value)
            for (int j = 0; j < groupSize; j++) {
                int have = count.getOrDefault(v + j, 0);
                if (have < c) return false;
                count.put(v + j, have - c);
            }
        }
        return true;
    }
}
