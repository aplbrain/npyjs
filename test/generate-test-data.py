import numpy as np
import json

records = {}

for dimensions in [(10,), (65, 65), (100, 100, 100), (4, 4, 4, 4, 4)]:
    for dtype in ["int8", "int16", "int64", "float32", "float64"]:
        name = f"./data/{'x'.join(str(i) for i in dimensions)}-{dtype}"
        data = np.random.randint(0, 255, dimensions).astype(dtype)
        records[name] = data.ravel()[-5:].tolist()
        np.save(name, data)
json.dump(
    records, open("records.json", "w"),
)
