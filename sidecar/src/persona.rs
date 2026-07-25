use std::collections::HashSet;

use serde::{Deserialize, Serialize};

pub const PASSPORT_ISSUER_SCHEMA_ID: u64 = 9303;
pub const MNC_ISSUER_SCHEMA_ID: u64 = 9310;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PersonaDocumentType {
    Eid,
    Passport,
    Mnc,
}

impl PersonaDocumentType {
    pub const fn issuer_schema_id(self) -> u64 {
        match self {
            Self::Eid | Self::Passport => PASSPORT_ISSUER_SCHEMA_ID,
            Self::Mnc => MNC_ISSUER_SCHEMA_ID,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct IdentityPersona {
    pub document_type: PersonaDocumentType,
    pub document_number: String,
    pub issuing_country: String,
    pub full_name: String,
    pub age: u8,
    pub nationality: String,
}

impl IdentityPersona {
    pub fn is_valid(&self) -> bool {
        !self.document_number.trim().is_empty()
            && is_iso_alpha_3(&self.issuing_country)
            && !self.full_name.trim().is_empty()
            && is_iso_alpha_3(&self.nationality)
    }
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RequestedDocumentType {
    Passport,
    Eid,
    Mnc,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", content = "value", rename_all = "snake_case")]
pub enum IdentityAttribute {
    DocumentType(RequestedDocumentType),
    DocumentNumber(String),
    IssuingCountry(String),
    FullName(String),
    MinimumAge(u8),
    Nationality(String),
}

pub fn available_for_persona(
    available: &HashSet<u64>,
    persona: Option<&IdentityPersona>,
) -> HashSet<u64> {
    let Some(persona) = persona else {
        return available.clone();
    };

    let persona_schema_id = persona.document_type.issuer_schema_id();

    available
        .iter()
        .copied()
        .filter(|schema_id| {
            *schema_id != PASSPORT_ISSUER_SCHEMA_ID && *schema_id != MNC_ISSUER_SCHEMA_ID
                || *schema_id == persona_schema_id
        })
        .collect()
}

pub fn includes_persona_document_schema<I>(proved_schema_ids: I, persona: &IdentityPersona) -> bool
where
    I: IntoIterator<Item = u64>,
{
    let persona_schema_id = persona.document_type.issuer_schema_id();
    proved_schema_ids
        .into_iter()
        .any(|schema_id| schema_id == persona_schema_id)
}

pub fn identity_attributes_match(
    persona: &IdentityPersona,
    attributes: &[IdentityAttribute],
) -> bool {
    attributes.iter().all(|attribute| match attribute {
        IdentityAttribute::DocumentType(requested) => match requested {
            RequestedDocumentType::Passport => {
                persona.document_type == PersonaDocumentType::Passport
            }
            RequestedDocumentType::Eid => persona.document_type == PersonaDocumentType::Eid,
            RequestedDocumentType::Mnc => persona.document_type == PersonaDocumentType::Mnc,
        },
        IdentityAttribute::DocumentNumber(value) => trim_eq(&persona.document_number, value),
        IdentityAttribute::IssuingCountry(value) => upper_trim_eq(&persona.issuing_country, value),
        IdentityAttribute::FullName(value) => trim_eq(&persona.full_name, value),
        IdentityAttribute::MinimumAge(value) => persona.age >= *value,
        IdentityAttribute::Nationality(value) => upper_trim_eq(&persona.nationality, value),
    })
}

fn trim_eq(left: &str, right: &str) -> bool {
    left.trim() == right.trim()
}

fn upper_trim_eq(left: &str, right: &str) -> bool {
    left.trim().eq_ignore_ascii_case(right.trim())
}

fn is_iso_alpha_3(value: &str) -> bool {
    let value = value.trim();
    value.len() == 3 && value.bytes().all(|byte| byte.is_ascii_alphabetic())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn passport_persona() -> IdentityPersona {
        IdentityPersona {
            document_type: PersonaDocumentType::Passport,
            document_number: "X1234567".to_string(),
            issuing_country: "USA".to_string(),
            full_name: "John Doe".to_string(),
            age: 30,
            nationality: "USA".to_string(),
        }
    }

    #[test]
    fn passport_persona_filters_out_mnc_document_credential() {
        let available = HashSet::from([1, PASSPORT_ISSUER_SCHEMA_ID, MNC_ISSUER_SCHEMA_ID]);
        let persona = passport_persona();

        let filtered = available_for_persona(&available, Some(&persona));

        assert!(filtered.contains(&1));
        assert!(filtered.contains(&PASSPORT_ISSUER_SCHEMA_ID));
        assert!(!filtered.contains(&MNC_ISSUER_SCHEMA_ID));
    }

    #[test]
    fn mnc_persona_filters_out_passport_document_credential() {
        let available = HashSet::from([1, PASSPORT_ISSUER_SCHEMA_ID, MNC_ISSUER_SCHEMA_ID]);
        let mut persona = passport_persona();
        persona.document_type = PersonaDocumentType::Mnc;

        let filtered = available_for_persona(&available, Some(&persona));

        assert!(filtered.contains(&1));
        assert!(!filtered.contains(&PASSPORT_ISSUER_SCHEMA_ID));
        assert!(filtered.contains(&MNC_ISSUER_SCHEMA_ID));
    }

    #[test]
    fn persona_document_schema_must_be_selected_for_attestation() {
        let persona = passport_persona();

        assert!(!includes_persona_document_schema([1, 11], &persona));
        assert!(includes_persona_document_schema(
            [1, PASSPORT_ISSUER_SCHEMA_ID],
            &persona
        ));
    }

    #[test]
    fn matching_passport_attributes_pass() {
        let persona = passport_persona();
        let attributes = vec![
            IdentityAttribute::DocumentType(RequestedDocumentType::Passport),
            IdentityAttribute::DocumentNumber(" X1234567 ".to_string()),
            IdentityAttribute::IssuingCountry("usa".to_string()),
            IdentityAttribute::FullName("John Doe".to_string()),
            IdentityAttribute::MinimumAge(18),
            IdentityAttribute::Nationality("usa".to_string()),
        ];

        assert!(identity_attributes_match(&persona, &attributes));
    }

    #[test]
    fn empty_attributes_match_when_document_proof_is_selected_elsewhere() {
        let persona = passport_persona();

        assert!(identity_attributes_match(&persona, &[]));
    }

    #[test]
    fn underage_persona_fails_minimum_age() {
        let mut persona = passport_persona();
        persona.age = 17;

        assert!(!identity_attributes_match(
            &persona,
            &[IdentityAttribute::MinimumAge(18)]
        ));
    }

    #[test]
    fn eid_persona_uses_icao_9303_credential_and_matches_eid_request() {
        let mut persona = passport_persona();
        persona.document_type = PersonaDocumentType::Eid;

        assert_eq!(
            persona.document_type.issuer_schema_id(),
            PASSPORT_ISSUER_SCHEMA_ID
        );
        assert!(identity_attributes_match(
            &persona,
            &[IdentityAttribute::DocumentType(RequestedDocumentType::Eid)]
        ));
    }

    #[test]
    fn persona_validation_rejects_invalid_country_codes() {
        let mut persona = passport_persona();
        assert!(persona.is_valid());

        persona.issuing_country = "US".to_string();
        assert!(!persona.is_valid());
    }
}
