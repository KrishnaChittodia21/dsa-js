class Solution {
    public int numBusesToDestination(int[][] routes, int source, int target) {
        if (source == target) return 0;

        Map<Integer, List<Integer>> stopToRoutes = new HashMap<>();
        for (int r = 0; r < routes.length; r++) {
            for (int s : routes[r]) stopToRoutes.computeIfAbsent(s, k -> new ArrayList<>()).add(r);
        }

        boolean[] usedRoute = new boolean[routes.length];
        Set<Integer> seenStop = new HashSet<>();
        seenStop.add(source);
        List<Integer> frontier = new ArrayList<>(List.of(source));
        int buses = 0;

        while (!frontier.isEmpty()) {
            buses++;                                     // everything found in this level needs one more bus
            List<Integer> next = new ArrayList<>();
            for (int stop : frontier) {
                for (int r : stopToRoutes.getOrDefault(stop, List.of())) {
                    if (usedRoute[r]) continue;
                    usedRoute[r] = true;                 // each route is scanned once in total
                    for (int s : routes[r]) {
                        if (s == target) return buses;
                        if (seenStop.add(s)) next.add(s);
                    }
                }
            }
            frontier = next;
        }
        return -1;
    }
}
