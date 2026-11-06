class Solution {
    public int[] deckRevealedIncreasing(int[] deck) {
        int n = deck.length;
        int[] cards = deck.clone();
        Arrays.sort(cards);
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) q.offer(i);
        int[] res = new int[n];
        for (int card : cards) {
            res[q.poll()] = card;                    // this position is revealed next
            if (!q.isEmpty()) q.offer(q.poll());     // next top goes to the bottom
        }
        return res;
    }
}
