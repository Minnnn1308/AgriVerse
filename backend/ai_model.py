import random
import math

class DeepBiologySimulator:
    def __init__(self, block_id: str):
        self.block_id = block_id
        
        # State
        self.soil_n = 120.0
        self.soil_p = 85.0
        self.soil_k = 150.0
        self.carbon_sequestered = 0.0
        self.mycorrhizal_health = 50.0  # 0 to 100
        
    def apply_fertilizer(self, fertilizer_type: str):
        """Mô phỏng áp dụng phân bón và tác động của nó tới sinh học đất"""
        if fertilizer_type == "ORGANIC":
            # Phân hữu cơ: Tăng cường nấm rễ, tích lũy Carbon
            self.mycorrhizal_health = min(100.0, self.mycorrhizal_health + 20)
            self.carbon_sequestered += 2.5
            self.soil_n += 15.0
            self.soil_p += 10.0
        elif fertilizer_type == "CHEMICAL_NPK":
            # Phân hóa học: Tăng NPK nhanh nhưng tổn hại nấm rễ
            self.mycorrhizal_health = max(0.0, self.mycorrhizal_health - 15)
            self.soil_n += 40.0
            self.soil_p += 30.0
            self.soil_k += 40.0
            self.carbon_sequestered -= 0.5 # Phát thải gián tiếp
            
    def simulate_tick(self, temperature: float, moisture: float):
        """Mô phỏng một bước thời gian (1 ngày hoặc 1 giờ)"""
        # 1. Chu trình Nitơ (Thất thoát do bay hơi, rửa trôi tùy nhiệt độ và độ ẩm)
        volatilization_rate = 0.05 * (temperature / 30.0) # Nóng thì bay hơi mạnh
        leaching_rate = 0.1 if moisture > 80 else 0.01    # Ướt thì rửa trôi
        
        self.soil_n -= self.soil_n * (volatilization_rate + leaching_rate)
        
        # 2. Hoạt động của nấm rễ (Mycorrhizal fungi)
        # Nấm rễ giúp cố định Lân (P) và tự nhiên tạo Nitrogen từ không khí
        if self.mycorrhizal_health > 60:
            self.soil_p += 0.5
            self.soil_n += 0.2
            
        # 3. Hấp thụ Carbon (Quang hợp & Vi sinh vật đất)
        # Cây quang hợp tốt nhất ở 25 độ C, độ ẩm 60-70%
        temp_factor = max(0, 1.0 - abs(temperature - 25.0) / 15.0)
        moisture_factor = max(0, 1.0 - abs(moisture - 65.0) / 30.0)
        
        daily_carbon = temp_factor * moisture_factor * (self.mycorrhizal_health / 100.0)
        self.carbon_sequestered += daily_carbon
        
        return {
            "block_id": self.block_id,
            "soil_n": round(self.soil_n, 2),
            "soil_p": round(self.soil_p, 2),
            "soil_k": round(self.soil_k, 2),
            "carbon_sequestered": round(self.carbon_sequestered, 2),
            "mycorrhizal_health": round(self.mycorrhizal_health, 2)
        }

if __name__ == "__main__":
    # Test simulator
    sim = DeepBiologySimulator("A1")
    print("Initial:", sim.simulate_tick(25.0, 65.0))
    sim.apply_fertilizer("ORGANIC")
    print("After Organic:", sim.simulate_tick(26.0, 70.0))
    sim.apply_fertilizer("CHEMICAL_NPK")
    print("After Chemical:", sim.simulate_tick(35.0, 85.0))
