# connector

## Update Package

1. Commit changes
2. Update version `npm version <version>`
3. Push changes

### For ssl handshake problems

```
"options": {
    "cryptoCredentialsDetails": {
        "minVersion": "TLSv1"
    },
    "trustServerCertificate": true,
    "trustedConnection": true
}
```

### For metalink official integration

```sql
create view vw_TE_StockPosition as
SELECT     b.ProductId AS ProductKey, b.BatchNumber, b.ExpiryMonth, b.ExpiryYear, CASE WHEN ShowQOH = 0 THEN 0 ELSE SUM(quantity) END AS TotalStock
FROM         dbo.vw_PR_ProductDetails AS a INNER JOIN
                      dbo.Batches AS b ON a.ProductKey = b.ProductId CROSS JOIN
                      dbo.OLPreferences
WHERE     (b.Quantity > 0) AND (b.HideBatch = 0)
GROUP BY b.ProductId, b.BatchNumber, b.ExpiryMonth, b.ExpiryYear, dbo.OLPreferences.ShowQOH
```

```sql
create view vw_TE_ProductDetails as
SELECT     p.Name AS ProductName, p.HSN as HSN, p.Code AS ProductCode, p.SinglePack AS Packing, p.BoxPack AS BoxPacking, p.CasePack AS CasePacking, 
                      CASE WHEN ShowMRP = 0 THEN 0 ELSE p.MRP END AS MRP, CASE WHEN Showptr = 0 THEN 0 ELSE p.PTR END AS PTR, g.GSTper AS GSTPercentage, 
                      CASE WHEN Showptr = 0 THEN 0 ELSE p.Sale END AS VPTR, CASE WHEN ShowPTs = 0 THEN 0 ELSE p.PTS END AS PTS, p.Marketer AS Manufacturer, 
                      '' AS ManufacturerCode, c.Name AS Company, c.Code AS CompanyCode, p.PFormula AS Contents, pc.Name AS Category, p.RackNo, p.SchemeEnabled, 
                      p.StartDate AS SchStartDate, p.EndDate AS SchEndDate, CASE WHEN ShowSch = 0 THEN 0 ELSE p.SchQty END AS SchQty, 
                      CASE WHEN ShowSch = 0 THEN 0 ELSE p.SchFree END AS SchFree, p.ProductKey
FROM         dbo.Product AS p INNER JOIN
                      dbo.Company AS c ON p.MktdBy = c.CompanyKey INNER JOIN
                      dbo.ProductCategory AS pc ON p.Category = pc.ProdCatKey INNER JOIN
                      dbo.GST AS G ON p.GSTID = G.GSTKey INNER JOIN
                      dbo.Rack AS r ON p.RackID = r.RackKey CROSS JOIN
                      dbo.OLPreferences
WHERE     (p.Hide = 0) AND (r.Locked = 0) AND (c.Hide = 0)
```
