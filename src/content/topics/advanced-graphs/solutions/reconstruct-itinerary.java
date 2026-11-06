class Solution {
    public String[] findItinerary(String[][] tickets) {
        Map<String, List<String>> adj = new HashMap<>();
        for (String[] t : tickets) adj.computeIfAbsent(t[0], k -> new ArrayList<>()).add(t[1]);
        // Descending order → removing the last element returns the lexically smallest destination in O(1)
        for (List<String> list : adj.values()) list.sort(Collections.reverseOrder());

        Deque<String> stack = new ArrayDeque<>();
        stack.push("JFK");
        List<String> route = new ArrayList<>();
        while (!stack.isEmpty()) {
            List<String> out = adj.get(stack.peek());
            if (out != null && !out.isEmpty()) {
                stack.push(out.remove(out.size() - 1));  // use one ticket
            } else {
                route.add(stack.pop());                  // dead end: this airport is fixed at the end
            }
        }
        Collections.reverse(route);
        return route.toArray(new String[0]);
    }
}
