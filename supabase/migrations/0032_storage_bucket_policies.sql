-- Migration 0032: tighten Storage access for private clinical buckets
--
-- Expected bucket model:
-- - therapist-vault: private bucket for therapist-owned files and expense receipts
-- - patient-documents: private bucket for sensitive patient documents

DROP POLICY IF EXISTS "therapist_vault_select_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "therapist_vault_insert_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "therapist_vault_update_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "therapist_vault_delete_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "patient_documents_select_owned_records" ON storage.objects;
DROP POLICY IF EXISTS "patient_documents_insert_owned_client_folder" ON storage.objects;
DROP POLICY IF EXISTS "patient_documents_delete_owned_records" ON storage.objects;

CREATE POLICY "therapist_vault_select_own_objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'therapist-vault'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'expenses'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

CREATE POLICY "therapist_vault_insert_own_objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'therapist-vault'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'expenses'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

CREATE POLICY "therapist_vault_update_own_objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'therapist-vault'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'expenses'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
)
WITH CHECK (
  bucket_id = 'therapist-vault'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'expenses'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

CREATE POLICY "therapist_vault_delete_own_objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'therapist-vault'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'expenses'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

CREATE POLICY "patient_documents_select_owned_records"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1
    FROM public.patient_documents docs
    WHERE docs.storage_path = name
      AND docs.therapist_id = auth.uid()
  )
);

CREATE POLICY "patient_documents_insert_owned_client_folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.therapist_id = auth.uid()
  )
);

CREATE POLICY "patient_documents_delete_owned_records"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1
    FROM public.patient_documents docs
    WHERE docs.storage_path = name
      AND docs.therapist_id = auth.uid()
  )
);
