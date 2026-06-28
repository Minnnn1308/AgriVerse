package agtech.models;

/**
 * EcoPet — Thú cưng sinh thái, tiến hóa theo hành vi canh tác hữu cơ.
 * Nông dân nhí chăm sóc thú cưng bằng điểm Eco-Karma (tích lũy từ trồng hữu cơ).
 */
public class EcoPet {
    private String petId;
    private String name;
    private String species; // Mộc Tinh, Rồng Đất, Tinh Linh Nước
    private int evolutionStage; // 1 → 2 → 3
    private int hunger;   // 0-100 (0 = đói, 100 = no)
    private int loyalty;  // 0-100 (độ thân thiết)

    // Species emoji mapping
    private static final String[][] SPECIES_DATA = {
        {"Mộc Tinh", "🌱", "🌿", "🌳"},       // Stage 1, 2, 3
        {"Rồng Đất", "🥚", "🦎", "🐉"},
        {"Tinh Linh Nước", "💧", "🐟", "🐋"}
    };

    public EcoPet(String petId, String name, String species) {
        this.petId = petId;
        this.name = name;
        this.species = species;
        this.evolutionStage = 1;
        this.hunger = 100;
        this.loyalty = 0;
    }

    public String getPetId() { return petId; }
    public String getName() { return name; }
    public String getSpecies() { return species; }
    public int getEvolutionStage() { return evolutionStage; }
    public int getHunger() { return hunger; }
    public int getLoyalty() { return loyalty; }

    /**
     * Cho thú cưng ăn (tốn 10 Eco-Karma).
     * @return true nếu cho ăn thành công
     */
    public boolean feed() {
        if (hunger >= 100) {
            System.out.println("🐾 " + name + " đã no bụng rồi!");
            return false;
        }
        hunger = Math.min(100, hunger + 30);
        loyalty = Math.min(100, loyalty + 5);
        System.out.println("🍎 " + name + " ăn xong! Độ no: " + hunger + "% | Thân thiết: " + loyalty);
        checkEvolution();
        return true;
    }

    /**
     * Mỗi ngày trôi qua, thú cưng đói dần.
     */
    public void passDay() {
        hunger = Math.max(0, hunger - 10);
        if (hunger <= 20) {
            System.out.println("😢 " + name + " đang đói! Hãy cho ăn nhé!");
        }
    }

    /**
     * Kiểm tra điều kiện tiến hóa.
     */
    private void checkEvolution() {
        if (evolutionStage < 3 && loyalty >= evolutionStage * 30) {
            evolutionStage++;
            System.out.println("✨ TIẾN HÓA! " + name + " (" + species + ") đã tiến hóa lên Giai đoạn " + evolutionStage + "!");
            System.out.println("  Hình dạng mới: " + getEmoji());
        }
    }

    /**
     * Lấy emoji tương ứng với loài và giai đoạn tiến hóa.
     */
    public String getEmoji() {
        for (String[] data : SPECIES_DATA) {
            if (data[0].equals(species)) {
                return data[Math.min(evolutionStage, 3)];
            }
        }
        return "🐾";
    }

    public String getMood() {
        if (hunger <= 20) return "😢 Đói";
        if (hunger <= 50) return "😐 Bình thường";
        if (loyalty >= 80) return "😍 Yêu chủ";
        return "😊 Vui vẻ";
    }

    @Override
    public String toString() {
        return getEmoji() + " " + name + " [" + species + " Lv." + evolutionStage + "] "
            + getMood() + " | No: " + hunger + "% | Thân: " + loyalty;
    }
}
