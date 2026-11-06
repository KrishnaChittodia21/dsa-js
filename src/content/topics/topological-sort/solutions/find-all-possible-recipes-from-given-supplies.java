class Solution {
    public String[] findAllRecipes(String[] recipes, String[][] ingredients, String[] supplies) {
        Map<String, List<Integer>> usedBy = new HashMap<>();   // ingredient name → recipe indices that need it
        int[] need = new int[recipes.length];                  // in-degree of each recipe
        for (int i = 0; i < recipes.length; i++) {
            need[i] = ingredients[i].length;
            for (String item : ingredients[i]) usedBy.computeIfAbsent(item, k -> new ArrayList<>()).add(i);
        }

        ArrayDeque<String> queue = new ArrayDeque<>(Arrays.asList(supplies));   // available items
        List<String> made = new ArrayList<>();
        while (!queue.isEmpty()) {
            for (int i : usedBy.getOrDefault(queue.poll(), List.of())) {
                if (--need[i] == 0) {              // last missing ingredient arrived
                    made.add(recipes[i]);
                    queue.add(recipes[i]);         // the recipe is now an ingredient too
                }
            }
        }
        return made.toArray(new String[0]);
    }
}
