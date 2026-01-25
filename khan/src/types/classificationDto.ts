export interface ClassificationDto {
    classificationId: string;
    classificationName: string;
    classificationNote: string;
}

export interface ClassificationRequest {
    name: string;
    note: string;
}