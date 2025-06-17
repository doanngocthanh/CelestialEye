package com.spring.ai.restai.dto;

/**
 * DTO for parsed CCCD (Citizen ID) information from QR code
 */
public class CccdInfo {
    private String id;              // Số căn cước (id)
    private String oldIdNumber;     // Số CMND cũ (nếu có)
    private String name;            // Họ và tên (name)
    private String birth;           // Ngày sinh (birth)
    private String sex;             // Giới tính (sex)
    private String nationality;     // Quốc tịch (nationality)
    private String place_of_origin; // Quê quán (place_of_origin)
    private String place_of_residence; // Nơi thường trú (place_of_residence)
    private String issueDate;       // Ngày cấp
    private String expiry;          // Ngày hết hạn (expiry)
    private String issuePlace;      // Nơi cấp (nếu có)
    
    public CccdInfo() {}
      public CccdInfo(String id, String oldIdNumber, String name, String birth, 
                    String sex, String nationality, String place_of_origin, String place_of_residence, String issueDate) {
        this.id = id;
        this.oldIdNumber = oldIdNumber;
        this.name = name;
        this.birth = birth;
        this.sex = sex;
        this.nationality = nationality;
        this.place_of_origin = place_of_origin;
        this.place_of_residence = place_of_residence;
        this.issueDate = issueDate;
    }
    
    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getOldIdNumber() { return oldIdNumber; }
    public void setOldIdNumber(String oldIdNumber) { this.oldIdNumber = oldIdNumber; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getBirth() { return birth; }
    public void setBirth(String birth) { this.birth = birth; }
    
    public String getSex() { return sex; }
    public void setSex(String sex) { this.sex = sex; }
    
    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }
    
    public String getPlace_of_origin() { return place_of_origin; }
    public void setPlace_of_origin(String place_of_origin) { this.place_of_origin = place_of_origin; }
    
    public String getPlace_of_residence() { return place_of_residence; }
    public void setPlace_of_residence(String place_of_residence) { this.place_of_residence = place_of_residence; }
    
    public String getIssueDate() { return issueDate; }
    public void setIssueDate(String issueDate) { this.issueDate = issueDate; }
    
    public String getExpiry() { return expiry; }
    public void setExpiry(String expiry) { this.expiry = expiry; }
    
    public String getIssuePlace() { return issuePlace; }
    public void setIssuePlace(String issuePlace) { this.issuePlace = issuePlace; }
      /**
     * Check if this appears to be CCCD data
     */
    public boolean isValid() {
        return id != null && !id.trim().isEmpty() &&
               name != null && !name.trim().isEmpty() &&
               birth != null && !birth.trim().isEmpty();
    }
    
    @Override
    public String toString() {
        return "CccdInfo{" +
               "id='" + id + '\'' +
               ", oldIdNumber='" + oldIdNumber + '\'' +
               ", name='" + name + '\'' +
               ", birth='" + birth + '\'' +
               ", sex='" + sex + '\'' +
               ", nationality='" + nationality + '\'' +
               ", place_of_origin='" + place_of_origin + '\'' +
               ", place_of_residence='" + place_of_residence + '\'' +
               ", issueDate='" + issueDate + '\'' +
               ", expiry='" + expiry + '\'' +
               ", issuePlace='" + issuePlace + '\'' +
               '}';
    }
}
