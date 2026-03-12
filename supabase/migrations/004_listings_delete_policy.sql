-- 仅卖家可删除自己的商品
CREATE POLICY "listings_delete" ON listings FOR DELETE USING (seller_id = auth.uid());
