class Solution {
    public String predictPartyVictory(String senate) {
        int n = senate.length();
        ArrayDeque<Integer> radiant = new ArrayDeque<>(), dire = new ArrayDeque<>();
        for (int i = 0; i < n; i++) (senate.charAt(i) == 'R' ? radiant : dire).offer(i);

        while (!radiant.isEmpty() && !dire.isEmpty()) {
            int r = radiant.poll(), d = dire.poll();
            // The earlier senator acts first and bans the other one.
            if (r < d) radiant.offer(r + n);  // acts again next round
            else dire.offer(d + n);
        }
        return radiant.isEmpty() ? "Dire" : "Radiant";
    }
}
